VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form ABMPlanCtas 
   BackColor       =   &H80000007&
   Caption         =   "ABM Plan de Cuentas"
   ClientHeight    =   4950
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   6465
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   4950
   ScaleWidth      =   6465
   Begin MSComctlLib.TreeView PlanCtas 
      Height          =   2895
      Left            =   120
      TabIndex        =   15
      Top             =   1800
      Width           =   6135
      _ExtentX        =   10821
      _ExtentY        =   5106
      _Version        =   393217
      Style           =   7
      Appearance      =   1
   End
   Begin VB.TextBox DescCta 
      Height          =   285
      Left            =   2280
      TabIndex        =   14
      Text            =   "Text1"
      Top             =   840
      Width           =   3855
   End
   Begin MSMask.MaskEdBox CodCta 
      Height          =   255
      Left            =   840
      TabIndex        =   13
      Top             =   840
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   450
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.ComboBox CD_H 
      Height          =   315
      Left            =   4560
      TabIndex        =   6
      Text            =   "Combo1"
      Top             =   1320
      Width           =   1695
   End
   Begin VB.ComboBox Nivel 
      Height          =   315
      Left            =   2880
      TabIndex        =   4
      Text            =   "Combo1"
      Top             =   1320
      Width           =   855
   End
   Begin VB.ComboBox CImputable 
      Height          =   315
      Left            =   1080
      TabIndex        =   2
      Text            =   "Combo1"
      Top             =   1320
      Width           =   1095
   End
   Begin MSComctlLib.Toolbar Toolbar1 
      Align           =   1  'Align Top
      Height          =   630
      Left            =   0
      TabIndex        =   7
      Top             =   0
      Width           =   6465
      _ExtentX        =   11404
      _ExtentY        =   1111
      ButtonWidth     =   609
      ButtonHeight    =   953
      Appearance      =   1
      _Version        =   393216
      Begin KewlButtonz.KewlButtons Command1 
         Height          =   495
         Index           =   9
         Left            =   9840
         TabIndex        =   12
         Top             =   2880
         Width           =   1095
         _ExtentX        =   1931
         _ExtentY        =   873
         BTYPE           =   8
         TX              =   "Salir"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMPlanCtas.frx":0000
         PICN            =   "ABMPlanCtas.frx":001C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Cancelar 
         Height          =   495
         Left            =   4680
         TabIndex        =   11
         Top             =   0
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cancelar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMPlanCtas.frx":209E
         PICN            =   "ABMPlanCtas.frx":20BA
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Aceptar 
         Height          =   495
         Left            =   3120
         TabIndex        =   10
         Top             =   0
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Aceptar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMPlanCtas.frx":2654
         PICN            =   "ABMPlanCtas.frx":2670
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Buscar 
         Height          =   495
         Left            =   1680
         TabIndex        =   9
         Top             =   0
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Buscar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMPlanCtas.frx":46F2
         PICN            =   "ABMPlanCtas.frx":470E
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Modificar 
         Height          =   495
         Left            =   120
         TabIndex        =   8
         Top             =   0
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cambiar"
         ENAB            =   0   'False
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMPlanCtas.frx":6418
         PICN            =   "ABMPlanCtas.frx":6434
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
   End
   Begin VB.Label Label4 
      BackColor       =   &H00000000&
      Caption         =   "Saldo"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Left            =   3840
      TabIndex        =   5
      Top             =   1320
      Width           =   975
   End
   Begin VB.Label Label3 
      BackColor       =   &H00000000&
      Caption         =   "Nivel"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Left            =   2280
      TabIndex        =   3
      Top             =   1320
      Width           =   975
   End
   Begin VB.Label Label2 
      BackColor       =   &H00000000&
      Caption         =   "Imputable"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Left            =   0
      TabIndex        =   1
      Top             =   1320
      Width           =   975
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Cuenta"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   375
      Left            =   0
      TabIndex        =   0
      Top             =   840
      Width           =   1575
   End
End
Attribute VB_Name = "ABMPlanCtas"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Aceptar_Click()
If Accion = "Nuevo" Then
    Set rsPlanCtas = db.OpenRecordset("PlanCtas", 1, 1)
    With rsPlanCtas
        .AddNew
        .Fields("CodCta") = CodCta
        .Fields("DescCta") = DescCta
        .Fields("Imputable") = CImputable
        .Fields("Nivel") = Nivel
        .Fields("Saldo") = CD_H
        .Update
    End With
    Set rsPlanCtas = Nothing
    'limpia y vuelve a cargar el plan de ctas
    Dim Tnodo As Node
    Dim Sp As String, Sh As String
    Dim Nivel1 As Long, Nivel2 As Long, Nivel3 As Long, Nivel4 As Long, Nivel5 As Long
    Dim NvoNodo1 As Long, NvoNodo2 As Long, NvoNodo3 As Long, NvoNodo4 As Long, NvoNodo5 As Long
    CImputable.ListIndex = 0
    CD_H.ListIndex = 0
    Nivel.ListIndex = 0
    DescCta = ""
    CodCta.Mask = ""
    CodCta.Text = ""
    CodCta.Mask = "#.#.#.##.###"
    PlanCtas.Nodes.Clear
    Set rsPlanCtas = db.OpenRecordset("select * from PlanCtas Order By CodCta")
    Nivel1 = 1: Nivel2 = 1: Nivel3 = 1: Nivel4 = 1: Nivel5 = 1
    NvoNodo1 = 0: NvoNodo2 = 0: NvoNodo3 = 0: NvoNodo4 = 0: NvoNodo5 = 0
    ' carga del TreeViuw
    Do While Not rsPlanCtas.EOF
        If rsPlanCtas!Nivel = 1 Then
            Sp = "nodo" & CStr(Nivel1)
            PlanCtas.Nodes.Add , , Sp, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
            Nivel1 = Nivel1 + 1
            NvoNodo1 = NvoNodo1 + 1
            prueba = NvoNodo1
        End If
        If rsPlanCtas!Nivel = 2 Then
            If NvoNodo1 = prueba Then
                Sp = "nodo" & CStr(NvoNodo1)
            End If
            Sh = Sp & "-" & CStr(Nivel2)
            PlanCtas.Nodes.Add Sp, tvwChild, Sh, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
            Nivel2 = Nivel2 + 1
            NvoNodo2 = NvoNodo2 + 1
            prueba1 = NvoNodo2
        End If
        If rsPlanCtas!Nivel = 3 Then
            If NvoNodo2 = prueba1 Then
                Sp = "nodo" & CStr(NvoNodo1) & "-" & CStr(NvoNodo2)
            End If
            Sh = Sp & "-" & CStr(Nivel3)
            PlanCtas.Nodes.Add Sp, tvwChild, Sh, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
            Nivel3 = Nivel3 + 1
            NvoNodo3 = NvoNodo3 + 1
            prueba2 = NvoNodo3
        End If
        If rsPlanCtas!Nivel = 4 Then
            If NvoNodo3 = prueba2 Then
                Sp = "nodo" & CStr(NvoNodo1) & "-" & CStr(NvoNodo2) & "-" & CStr(NvoNodo3)
            End If
            Sh = Sp & "-" & CStr(Nivel4)
            PlanCtas.Nodes.Add Sp, tvwChild, Sh, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
            Nivel4 = Nivel4 + 1
            NvoNodo4 = NvoNodo4 + 1
            prueba3 = NvoNodo4
        End If
        If rsPlanCtas!Nivel = 5 Then
            If NvoNodo4 = prueba3 Then
                Sp = "nodo" & CStr(NvoNodo1) & "-" & CStr(NvoNodo2) & "-" & CStr(NvoNodo3) & "-" & CStr(NvoNodo4)
            End If
            Sh = Sp & "-" & CStr(Nivel5)
            PlanCtas.Nodes.Add Sp, tvwChild, Sh, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
            Nivel5 = Nivel5 + 1
        End If
        rsPlanCtas.MoveNext
    Loop
    Set rsPlanCtas = Nothing
End If
        
End Sub



Private Sub Cancelar_Click()
Call Form_Load
End Sub

Private Sub Form_Load()
Dim Tnodo As Node
Dim Sp As String, Sh As String
Dim Nivel1 As Long, Nivel2 As Long, Nivel3 As Long, Nivel4 As Long, Nivel5 As Long
Dim NvoNodo1 As Long, NvoNodo2 As Long, NvoNodo3 As Long, NvoNodo4 As Long, NvoNodo5 As Long
CImputable.Clear
CImputable.AddItem ("SI")
CImputable.AddItem ("NO")
CImputable.ListIndex = 0
CD_H.Clear
CD_H.AddItem ("Deudor")
CD_H.AddItem ("Acredor")
CD_H.ListIndex = 0
Nivel.Clear
Nivel.AddItem ("1")
Nivel.AddItem ("2")
Nivel.AddItem ("3")
Nivel.AddItem ("4")
Nivel.AddItem ("5")
Nivel.ListIndex = 0
CodCta.Mask = ""
CodCta.Text = ""
CodCta.Mask = "#.#.#.##.###"
DescCta = ""
Accion = "Nuevo"
Set rsPlanCtas = db.OpenRecordset("SELECT * FROM PlanCtas Order By CodCta")
Nivel1 = 1: Nivel2 = 1: Nivel3 = 1: Nivel4 = 1: Nivel5 = 1
NvoNodo1 = 0: NvoNodo2 = 0: NvoNodo3 = 0: NvoNodo4 = 0: NvoNodo5 = 0
' carga del TreeViuw
With PlanCtas
        .Style = tvwTreelinesPlusMinusText
        .LineStyle = tvwRootLines
        .PathSeparator = "\"
        .Indentation = Screen.TwipsPerPixelX * 5 '256
        ' No permitir la edición automática del texto
        .LabelEdit = tvwManual
        ' Para que se pueda expandir al seleccionar un nodo,
        ' cambia este valor a True,
        ' si se deja en False, tendrás que hacer doble-click
        .SingleSel = False
        ' Para que al perder el foco,
        ' se siga viendo el que está seleccionado
        .HideSelection = False
        '
        .Refresh
    End With
PlanCtas.Nodes.Clear
Do While Not rsPlanCtas.EOF
    If rsPlanCtas!Nivel = 1 Then
        Sp = "nodo" & CStr(Nivel1)
        PlanCtas.Nodes.Add , , Sp, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
        Nivel1 = Nivel1 + 1
        NvoNodo1 = NvoNodo1 + 1
        prueba = NvoNodo1
    End If
    If rsPlanCtas!Nivel = 2 Then
        If NvoNodo1 = prueba Then
            Sp = "nodo" & CStr(NvoNodo1)
        End If
        Sh = Sp & "-" & CStr(Nivel2)
        PlanCtas.Nodes.Add Sp, tvwChild, Sh, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
        Nivel2 = Nivel2 + 1
        NvoNodo2 = NvoNodo2 + 1
        prueba1 = NvoNodo2
    End If
    If rsPlanCtas!Nivel = 3 Then
        If NvoNodo2 = prueba1 Then
            Sp = "nodo" & CStr(NvoNodo1) & "-" & CStr(NvoNodo2)
        End If
        Sh = Sp & "-" & CStr(Nivel3)
        PlanCtas.Nodes.Add Sp, tvwChild, Sh, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
        Nivel3 = Nivel3 + 1
        NvoNodo3 = NvoNodo3 + 1
        prueba2 = NvoNodo3
    End If
    If rsPlanCtas!Nivel = 4 Then
        If NvoNodo3 = prueba2 Then
            Sp = "nodo" & CStr(NvoNodo1) & "-" & CStr(NvoNodo2) & "-" & CStr(NvoNodo3)
        End If
        Sh = Sp & "-" & CStr(Nivel4)
        PlanCtas.Nodes.Add Sp, tvwChild, Sh, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
        Nivel4 = Nivel4 + 1
        NvoNodo4 = NvoNodo4 + 1
        prueba3 = NvoNodo4
    End If
    If rsPlanCtas!Nivel = 5 Then
        If NvoNodo4 = prueba3 Then
            Sp = "nodo" & CStr(NvoNodo1) & "-" & CStr(NvoNodo2) & "-" & CStr(NvoNodo3) & "-" & CStr(NvoNodo4)
        End If
        Sh = Sp & "-" & CStr(Nivel5)
        PlanCtas.Nodes.Add Sp, tvwChild, Sh, rsPlanCtas!CodCta & "  " & rsPlanCtas!DescCta
        Nivel5 = Nivel5 + 1
    End If
    rsPlanCtas.MoveNext
Loop
Set rsPlanCtas = Nothing
End Sub

