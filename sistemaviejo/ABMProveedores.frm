VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form ABMProveedores 
   Caption         =   "ABM Proveedores"
   ClientHeight    =   3795
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   7590
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   3795
   ScaleWidth      =   7590
   Begin VB.Frame ABMProveedores 
      ForeColor       =   &H00FF0000&
      Height          =   3735
      Left            =   0
      TabIndex        =   0
      Top             =   0
      Width           =   7575
      Begin VB.ComboBox IIBB 
         Appearance      =   0  'Flat
         Height          =   315
         Left            =   1920
         TabIndex        =   13
         Text            =   "IIBB"
         Top             =   2520
         Width           =   2295
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   ">>"
         Height          =   435
         Index           =   3
         Left            =   5820
         TabIndex        =   12
         Top             =   2400
         Width           =   495
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   ">"
         Height          =   435
         Index           =   2
         Left            =   5340
         TabIndex        =   11
         Top             =   2400
         Width           =   495
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   "<"
         Height          =   435
         Index           =   1
         Left            =   4800
         TabIndex        =   10
         Top             =   2400
         Width           =   495
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   "<<"
         Height          =   435
         Index           =   0
         Left            =   4320
         TabIndex        =   9
         Top             =   2400
         Width           =   495
      End
      Begin VB.ComboBox Combo2 
         Appearance      =   0  'Flat
         Height          =   315
         Left            =   1920
         TabIndex        =   8
         Text            =   "Combo1"
         Top             =   2160
         Width           =   1935
      End
      Begin VB.TextBox Text2 
         Appearance      =   0  'Flat
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   0
         Left            =   1920
         TabIndex        =   7
         Text            =   "Text1"
         Top             =   360
         Width           =   4575
      End
      Begin VB.TextBox Text2 
         Appearance      =   0  'Flat
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   1
         Left            =   1920
         TabIndex        =   6
         Text            =   "Text1"
         Top             =   720
         Width           =   4575
      End
      Begin VB.TextBox Text2 
         Appearance      =   0  'Flat
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   2
         Left            =   1920
         TabIndex        =   5
         Text            =   "Text1"
         Top             =   1080
         Width           =   975
      End
      Begin VB.TextBox Text2 
         Appearance      =   0  'Flat
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   3
         Left            =   3960
         TabIndex        =   4
         Text            =   "Text1"
         Top             =   1080
         Width           =   2535
      End
      Begin VB.TextBox Text2 
         Appearance      =   0  'Flat
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   4
         Left            =   1920
         TabIndex        =   3
         Text            =   "Text1"
         Top             =   1440
         Width           =   2055
      End
      Begin VB.TextBox Text2 
         Appearance      =   0  'Flat
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   5
         Left            =   4560
         TabIndex        =   2
         Text            =   "Text1"
         Top             =   1440
         Width           =   1935
      End
      Begin VB.TextBox Text2 
         Appearance      =   0  'Flat
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   6
         Left            =   1920
         TabIndex        =   1
         Text            =   "Text1"
         Top             =   1800
         Width           =   4575
      End
      Begin KewlButtonz.KewlButtons CancelarProv 
         Height          =   495
         Left            =   6120
         TabIndex        =   14
         Top             =   3000
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cancelar"
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
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMProveedores.frx":0000
         PICN            =   "ABMProveedores.frx":001C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons AceptarProv 
         Height          =   495
         Left            =   4680
         TabIndex        =   15
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Aceptar"
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
         MICON           =   "ABMProveedores.frx":05B6
         PICN            =   "ABMProveedores.frx":05D2
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons BuscarProv 
         Height          =   495
         Left            =   3000
         TabIndex        =   16
         Top             =   3000
         Width           =   1575
         _ExtentX        =   2778
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
         MICON           =   "ABMProveedores.frx":2654
         PICN            =   "ABMProveedores.frx":2670
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons EliminaProv 
         Height          =   495
         Left            =   120
         TabIndex        =   17
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Eliminar"
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
         MICON           =   "ABMProveedores.frx":437A
         PICN            =   "ABMProveedores.frx":4396
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons CambiaProv 
         Height          =   495
         Left            =   1560
         TabIndex        =   18
         Top             =   3000
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
         MICON           =   "ABMProveedores.frx":4930
         PICN            =   "ABMProveedores.frx":494C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label11 
         Caption         =   "Ingreso Brutos"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   375
         Left            =   360
         TabIndex        =   27
         Top             =   2520
         Width           =   1455
      End
      Begin VB.Label Label7 
         Caption         =   "CUIT"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   4080
         TabIndex        =   26
         Top             =   1440
         Width           =   975
      End
      Begin VB.Label Label14 
         Caption         =   "Condición IVA"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   360
         TabIndex        =   25
         Top             =   2160
         Width           =   1455
      End
      Begin VB.Label Label16 
         Caption         =   "Email"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   360
         TabIndex        =   24
         Top             =   1800
         Width           =   1455
      End
      Begin VB.Label Label17 
         Caption         =   "Telefono"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   360
         TabIndex        =   23
         Top             =   1440
         Width           =   1455
      End
      Begin VB.Label Label18 
         Caption         =   "Localidad"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   3000
         TabIndex        =   22
         Top             =   1080
         Width           =   1455
      End
      Begin VB.Label Label19 
         Caption         =   "Código Postal"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   360
         TabIndex        =   21
         Top             =   1080
         Width           =   1455
      End
      Begin VB.Label Label20 
         Caption         =   "Dirección"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   360
         TabIndex        =   20
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Label21 
         Caption         =   "Descripcion"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   255
         Left            =   360
         TabIndex        =   19
         Top             =   360
         Width           =   1455
      End
   End
End
Attribute VB_Name = "ABMProveedores"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub AceptarProv_Click()
If Accion = "Nuevo" Then
On Error GoTo ERR_cmdAltaRegistro:
    Dim nAccessValue As Integer
    Screen.MousePointer = vbHourglass
    nAccessValue = 0
    ' aplica los permisos deseados por el usuario
    Set rsFleteros = db.OpenRecordset("Fleteros")
    
    Dim lPrimaryKey As Long
    Dim sMessage As String
    ' recupera una clave única desde la rutina GetPrimaryKey
    lPrimaryKey = CodigoProveedor
        With rsFleteros
            .AddNew
            .Fields("CodFlet") = lPrimaryKey
            .Fields("DescFlet") = Text2(0)
            .Fields("Direccion") = Text2(1)
            .Fields("Telefono") = Text2(4)
            .Fields("EMail") = Text2(6)
            .Fields("CUIT") = Text2(5)
            .Fields("CP") = Text2(2)
            .Fields("Localidad") = Text2(3)
            .Fields("CodIVA") = Combo2.ListIndex + 1
            .Fields("IIBB") = IIBB.ListIndex + 1
            .Update
        End With
        Set rsFleteros = Nothing
        Combo2.ListIndex = 0
        IIBB.ListIndex = 0
        Items = 0
        For Items = Items + 1 To Text2.Count
            Text2(Items - 1) = ""
        Next
        AceptarProv.Enabled = True: CancelarProv.Enabled = True: BuscarProv.Enabled = True: EliminaProv.Enabled = False
        Accion = "Nuevo"
        ' Si el código pasa por aquí es porque todo ha ido bien
        sMessage = "El Fletero fue agregado exitosamente con el Codigo:   " & lPrimaryKey
        MsgBox sMessage, vbInformation, "Alta Fletero"
        Screen.MousePointer = vbDefault
        Exit Sub
ERR_cmdAltaRegistro:
    TableError Err
    Set rsFleteros = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Buscar" Then
On Error GoTo ERR_cmdBuscar:
     Screen.MousePointer = vbHourglass
     Items = 0: Criterio = ""
     For Items = Items + 1 To Text2.Count
        If Not Text2(Items - 1).Text = "" And Items < 8 Then
            If Not Criterio = "" Then
                Criterio = Criterio & " AND "
            End If
            Select Case Text2(Items - 1).Index
                Case 0: Criterio = Criterio & "DescFlet Like '*" & Text2(0) & "*'"
                Case 1: Criterio = Criterio & "Direccion LIKE '*" & Text2(1) & "*'"
                Case 2: Criterio = Criterio & "CP LIKE '*" & Text2(2) & "*'"
                Case 3: Criterio = Criterio & "Localidad LIKE '*" & Text2(3) & "*'"
                Case 4: Criterio = Criterio & "Telefono LIKE '*" & Text2(4) & "*'"
                Case 5: Criterio = Criterio & "Email LIKE '*" & Text2(6) & "*'"
                Case 6: Criterio = Criterio & "CUIT LIKE '*" & Text2(5) & "*'"
            End Select
        End If
    Next
    If Not Criterio = "" Then
        SQL = "SELECT * FROM Fleteros WHERE " & Criterio & ""
    Else
        SQL = "SELECT * FROM Fleteros"
    End If
    Set rsFleteros = db.OpenRecordset(SQL)
    Call MostrarProv
    CambiaProv.Enabled = True: AceptarProv.Enabled = False
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdBuscar:
    TableError Err
    Set rsFleteros = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Modificar" Then
On Error GoTo ERR_cmdModificar
    Screen.MousePointer = vbHourglass
    With rsFleteros
        .Fields("DescFlet") = Text2(0)
        .Fields("Direccion") = Text2(1)
        .Fields("CP") = Text2(2)
        .Fields("Localidad") = Text2(3)
        .Fields("Telefono") = Text2(4)
        .Fields("Email") = Text2(6)
        .Fields("CUIT") = Text2(5)
        .Fields("CodIVA") = Combo2.ListIndex + 1
        .Fields("IIBB") = IIBB.ListIndex + 1
        .Update
        .LockEdits = False
    End With
    
    MsgBox "El Fletero ha sido Modificado Exitosamente", vbInformation, "Modificar Registro"
    Items = 0
    For Items = Items + 1 To Text2.Count
        Text2(Items - 1).BackColor = &HFFFFFF
        Text2(Items - 1) = ""
    Next
    Combo2.BackColor = &HFFFFFF
    Combo2.ListIndex = 0
    IIBB.ListIndex = 0
    IIBB.BackColor = &HFFFFFF
    Accion = "Nuevo"
    Items = 0
        For Items = Items + 1 To cmdMover1.Count
             cmdMover1(Items - 1).Visible = False
        Next
    EliminaProv.Enabled = False: BuscarProv.Enabled = True: AceptarProv.Enabled = True: CancelarProv.Enabled = True
    Set rsFleteros = Nothing
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdModificar:
    TableError Err
    Set rsFleteros = Nothing
End If

End Sub

Private Sub BuscarProv_Click()
Items = 0
For Items = Items + 1 To Text2.Count
    Text2(Items - 1).BackColor = &H40C0&
Next
Combo2.BackColor = &H40C0&
IIBB.BackColor = &H40C0&

EliminaProv.Enabled = False: CambiaProv.Enabled = False: BuscarProv.Enabled = False: AceptarProv.Enabled = True: CancelarProv.Enabled = True
Accion = "Buscar"
End Sub

Private Sub CambiaProv_Click()
On Error GoTo ERR_cmdCambiar:
Items = 0
For Items = Items + 1 To Text2.Count
    Text2(Items - 1).BackColor = &HFFFFFF
Next
Combo2.BackColor = &HFFFFFF
IIBB.BackColor = &HFFFFFF
EliminaProv.Enabled = False: CambiaProv.Enabled = False: BuscarProv.Enabled = False: AceptarProv.Enabled = True: CancelarProv.Enabled = True
rsFleteros.Edit
rsFleteros.LockEdits = True
Accion = "Modificar"
Exit Sub
ERR_cmdCambiar:
    TableError Err
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &H40C0&
    Next
    Combo1.BackColor = &H40C0&
    IIBB.BackColor = &H40C0&
    CtaCont.BackColor = &H40C0&
    EliminaProv.Enabled = False: CambiaProv.Enabled = True: BuscarProv.Enabled = False: AceptarProv.Enabled = True: CancelarProv.Enabled = True

End Sub

Private Sub CancelarProv_Click()
Set rsSituacionIVA = db.OpenRecordset("SituacionIVA", 2)
Combo2.Clear
Do While Not rsSituacionIVA.EOF
    Combo2.AddItem rsSituacionIVA!Descripcion
    rsSituacionIVA.MoveNext
Loop
Combo2.ListIndex = 0
Combo2.BackColor = &H80000005
IIBB.Clear
IIBB.AddItem "Exento"
IIBB.AddItem "Agente de Retención"
IIBB.ListIndex = 0
IIBB.BackColor = &H80000005

Items = 0
For Items = Items + 1 To Text2.Count
    Text2(Items - 1) = ""
    Text2(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover1.Count
    cmdMover1(Items - 1).Visible = False
Next
AceptarProv.Enabled = True: CancelarProv.Enabled = True: BuscarProv.Enabled = True: EliminaProv.Enabled = False: CambiaProv.Enabled = False
Accion = "Nuevo"

End Sub

Private Sub cmdMover1_Click(Index As Integer)
' se definen las constantes para indicar el tipo de navegación
    ' cada constante se corresponde con un índice de la matriz de
    ' controles
    Const MOVE_FIRST = 0
    Const MOVE_PREVIOUS = 1
    Const MOVE_NEXT = 2
    Const MOVE_LAST = 3
    With rsFleteros
        Select Case Index
            ' se mueve al primer registro
            Case MOVE_FIRST:
                .MoveFirst
            ' se mueve al registro anterior, si llega al inicio
            ' del recordset, se mueve al primer registro
            Case MOVE_PREVIOUS:
                .MovePrevious
                If (.BOF) Then .MoveFirst
            ' se mueve al registro siguiente, si llega al final
            ' del recordset, se mueve al último registro
            Case MOVE_NEXT:
                .MoveNext
                If (.EOF) Then .MoveLast
            ' se mueve al último registro
            Case MOVE_LAST:
                .MoveLast
        End Select
    End With
    ' visualiza el registro
    MostrarProv
End Sub

Private Sub Form_Load()
Set rsSituacionIVA = db.OpenRecordset("SituacionIVA", 2)
Combo2.Clear
Do While Not rsSituacionIVA.EOF
    Combo2.AddItem rsSituacionIVA!Descripcion
    rsSituacionIVA.MoveNext
Loop
Combo2.ListIndex = 0
Combo2.BackColor = &H80000005
IIBB.Clear
IIBB.AddItem "Exento"
IIBB.AddItem "Agente de Retención"
IIBB.ListIndex = 0
IIBB.BackColor = &H80000005

Items = 0
For Items = Items + 1 To Text2.Count
    Text2(Items - 1) = ""
    Text2(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover1.Count
    cmdMover1(Items - 1).Visible = False
Next
AceptarProv.Enabled = True: CancelarProv.Enabled = True: BuscarProv.Enabled = True: EliminaProv.Enabled = False: CambiaProv.Enabled = False
Accion = "Nuevo"

End Sub
