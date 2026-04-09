VERSION 5.00
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form FactNCND 
   BackColor       =   &H80000007&
   Caption         =   "Facturas, Nota de Credito y Nota de Debito"
   ClientHeight    =   6255
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   8565
   LinkTopic       =   "Form1"
   ScaleHeight     =   6255
   ScaleWidth      =   8565
   StartUpPosition =   3  'Windows Default
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   33
      Left            =   2040
      TabIndex        =   4
      Text            =   "Text1"
      Top             =   1320
      Width           =   5655
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   32
      Left            =   6960
      TabIndex        =   45
      Text            =   "Text1"
      Top             =   5760
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   31
      Left            =   6960
      TabIndex        =   44
      Text            =   "Text1"
      Top             =   5400
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   30
      Left            =   6960
      TabIndex        =   43
      Text            =   "Text1"
      Top             =   5040
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   29
      Left            =   6960
      TabIndex        =   26
      Text            =   "Text1"
      Top             =   4440
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   28
      Left            =   6120
      TabIndex        =   25
      Text            =   "Text1"
      Top             =   4440
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   27
      Left            =   1680
      TabIndex        =   39
      Text            =   "Text1"
      Top             =   4440
      Width           =   4335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   26
      Left            =   840
      TabIndex        =   24
      Text            =   "Text1"
      Top             =   4440
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   25
      Left            =   6960
      TabIndex        =   23
      Text            =   "Text1"
      Top             =   4080
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   24
      Left            =   6120
      TabIndex        =   22
      Text            =   "Text1"
      Top             =   4080
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   23
      Left            =   1680
      TabIndex        =   38
      Text            =   "Text1"
      Top             =   4080
      Width           =   4335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   22
      Left            =   840
      TabIndex        =   21
      Text            =   "Text1"
      Top             =   4080
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   21
      Left            =   6960
      TabIndex        =   20
      Text            =   "Text1"
      Top             =   3720
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   20
      Left            =   6120
      TabIndex        =   19
      Text            =   "Text1"
      Top             =   3720
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   19
      Left            =   1680
      TabIndex        =   37
      Text            =   "Text1"
      Top             =   3720
      Width           =   4335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   18
      Left            =   840
      TabIndex        =   18
      Text            =   "Text1"
      Top             =   3720
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   17
      Left            =   6960
      TabIndex        =   27
      Text            =   "Text1"
      Top             =   3360
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   16
      Left            =   6120
      TabIndex        =   16
      Text            =   "Text1"
      Top             =   3360
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   15
      Left            =   1680
      TabIndex        =   36
      Text            =   "Text1"
      Top             =   3360
      Width           =   4335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   14
      Left            =   840
      TabIndex        =   15
      Text            =   "Text1"
      Top             =   3360
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   13
      Left            =   6960
      TabIndex        =   14
      Text            =   "Text1"
      Top             =   3000
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   12
      Left            =   6120
      TabIndex        =   13
      Text            =   "Text1"
      Top             =   3000
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   11
      Left            =   1680
      TabIndex        =   35
      Text            =   "Text1"
      Top             =   3000
      Width           =   4335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   10
      Left            =   840
      TabIndex        =   12
      Text            =   "Text1"
      Top             =   3000
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   9
      Left            =   6960
      TabIndex        =   11
      Text            =   "Text1"
      Top             =   2640
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   8
      Left            =   6120
      TabIndex        =   10
      Text            =   "Text1"
      Top             =   2640
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   7
      Left            =   1680
      TabIndex        =   34
      Text            =   "Text1"
      Top             =   2640
      Width           =   4335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   6
      Left            =   840
      TabIndex        =   9
      Text            =   "Text1"
      Top             =   2640
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   5
      Left            =   6960
      TabIndex        =   8
      Text            =   "Text1"
      Top             =   2280
      Width           =   1215
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   4
      Left            =   6120
      TabIndex        =   7
      Text            =   "Text1"
      Top             =   2280
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   1680
      TabIndex        =   6
      Text            =   "Text1"
      Top             =   2280
      Width           =   4335
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   840
      TabIndex        =   5
      Text            =   "Text1"
      Top             =   2280
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2880
      TabIndex        =   28
      Text            =   "Text1"
      Top             =   840
      Width           =   4815
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   2040
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   840
      Width           =   735
   End
   Begin VB.ComboBox Combo1 
      Height          =   315
      Left            =   2040
      TabIndex        =   1
      Text            =   "Combo1"
      Top             =   360
      Width           =   3015
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   6120
      TabIndex        =   2
      Top             =   360
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   615
      Left            =   3600
      TabIndex        =   47
      Top             =   5280
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   1085
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
      MICON           =   "FactNCND.frx":0000
      PICN            =   "FactNCND.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Observacion"
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
      Height          =   255
      Index           =   9
      Left            =   720
      TabIndex        =   46
      Top             =   1320
      Width           =   1215
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Total"
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
      Height          =   255
      Index           =   8
      Left            =   5640
      TabIndex        =   42
      Top             =   5760
      Width           =   1215
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Total IVA"
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
      Height          =   255
      Index           =   7
      Left            =   5640
      TabIndex        =   41
      Top             =   5400
      Width           =   1215
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Total Neto"
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
      Height          =   255
      Index           =   6
      Left            =   5640
      TabIndex        =   40
      Top             =   5040
      Width           =   1215
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Importe"
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
      Height          =   255
      Index           =   5
      Left            =   6960
      TabIndex        =   33
      Top             =   1920
      Width           =   1215
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Por IVA"
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
      Height          =   255
      Index           =   4
      Left            =   6120
      TabIndex        =   32
      Top             =   1920
      Width           =   735
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
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
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   3
      Left            =   2040
      TabIndex        =   31
      Top             =   1920
      Width           =   3615
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Codigo"
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
      Height          =   255
      Index           =   2
      Left            =   600
      TabIndex        =   30
      Top             =   1920
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fecha"
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
      Height          =   255
      Index           =   1
      Left            =   5400
      TabIndex        =   29
      Top             =   360
      Width           =   735
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Empresa"
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
      Height          =   255
      Index           =   0
      Left            =   720
      TabIndex        =   17
      Top             =   840
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Comprobante"
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
      Height          =   255
      Index           =   13
      Left            =   720
      TabIndex        =   0
      Top             =   360
      Width           =   1215
   End
End
Attribute VB_Name = "FactNCND"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private TIVA As Double, TNETO As Double, TGRAL As Double
Private IVA As Double, STOTAL As Double
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabFact
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroFact") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function

Private Sub Aceptar_Click()
On Error GoTo ERR_cmdGrabarFact
Dim lPrimaryKey As Long
Dim sMessage As String
If Comprobante.ListIndex = 0 Then
    Set rsEncabFact = db.OpenRecordset("EncabFact", 1, 1)
    Set rsDetFact = db.OpenRecordset("DetFact", 1, 1)
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    Set rsAsientos = db.OpenRecordset("Asientos", 1, 1)
    'limpia temporales
    Do While Not TrsEncabFact.EOF
        TrsEncabFact.Delete
        TrsEncabFact.MoveNext
    Loop
    Do While Not TrsDetFact.EOF
        TrsDetFact.Delete
        TrsDetFact.MoveNext
    Loop
    'busca número Factura
    lPrimaryKey = GetPrimaryKey
    'graba encabezado en temporales
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("Codigo") = Text1(0)
        .Fields("TipoFact") = Combo1.ListIndex + 2 '2 - NC, 3- ND
        .Fields("Obs") = Text1(33)
        .Fields("TNeto") = FormatNumber(TNETO)
        .Fields("TIVA") = FormatNumber(TIVA)
        .Fields("TGral") = FormatNumber(TGRAL)
        .Update
    End With
    'graba encabezado
    With rsEncabFact
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("Codigo") = Text1(0)
        .Fields("TipoFact") = Combo1.ListIndex + 2 '2 - NC, 3- ND
        .Fields("Obs") = Text1(33)
        .Fields("TNeto") = FormatNumber(TNETO)
        .Fields("TIVA") = FormatNumber(TIVA)
        .Fields("TGral") = FormatNumber(TGRAL)
        .Update
    End With
    'graba detalle en temporales
    Items = 2
    For Items = Items To 26 Step 4
        With TrsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("NroRem") = Text1(Item)
            .Fields("Mercaderia") = Text1(Item + 1)
            .Fields("Procedencia") = Lista.SubItems(4)
            .Fields("Destino") = Lista.SubItems(5)
            .Fields("Kilos") = Lista.SubItems(6)
            .Fields("Tarifa") = Lista.SubItems(7)
            .Fields("STotal") = Lista.SubItems(8)
            .Update
        End With
    Next
    'graba detalle de factura
    Items = 0
    For Items = Items + 1 To LViajesFact.ListItems.Count
        Set Lista = LViajesFact.ListItems.Item(Items)
        With rsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("FechaViaje") = Lista.Tag
            .Fields("NroRem") = Lista.SubItems(1)
            .Fields("Chofer") = Lista.SubItems(2)
            .Fields("Mercaderia") = Lista.SubItems(3)
            .Fields("Procedencia") = Lista.SubItems(4)
            .Fields("Destino") = Lista.SubItems(5)
            .Fields("Kilos") = Lista.SubItems(6)
            .Fields("Tarifa") = Lista.SubItems(7)
            .Fields("STotal") = Lista.SubItems(8)
            .Update
        End With
        'actualiza estado de los viajes
        Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroRemito = '" & Lista.SubItems(1) & "' AND CodEmpresa =  " & Lista.SubItems(9) & "")
        rsLiqDetViajes.Edit
        rsLiqDetViajes.LockEdits = True
        rsLiqDetViajes.Fields("Facturado") = "SI"
        rsLiqDetViajes.Update
        rsLiqDetViajes.LockEdits = False
    Next
    'GRABA FACTURA EN CTA CTE
    Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodEmp") = Text1(0)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 1
        .Fields("Debe") = FormatNumber(TFACT)
        .Fields("SaldoComp") = FormatNumber(TFACT)
        .Update
    End With
    Set rsEncabFact = Nothing
    Set rsDetFact = Nothing
    Set TrsEncabFact = Nothing
    Set TrsDetFact = Nothing
    Set rsCtaCteEmp = Nothing
    'graba asiento coorespondiente
    Set rsAsientos = Nothing
    
    Call Form_Load
    'factura grabada correctamente
    With MsgFact
        .Show
        .Height = 2295
        .Width = 6285
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .NroFact = lPrimaryKey
    End With
End If
Exit Sub
ERR_cmdGrabarFact:
    TableError Err
    Set rsEncabFact = Nothing
    Set rsDetFact = Nothing
    Set TrsEncabFact = Nothing
    Set TrsDetFact = Nothing
End Sub
End Sub

Private Sub Form_Load()
TIVA = 0: TNETO = 0: TGRAL = 0: IVA = 0: STOTAL = 0
Combo1.Clear
Combo1.AddItem ("Nota de Credito")
Combo1.AddItem ("Nota de Debito")
Combo1.ListIndex = 0
I = 0
For I = I + 1 To Text1.Count
    If I = 5 Or I = 9 Or I = 13 Or I = 17 Or I = 21 Or I = 25 Or I = 29 Then
        Text1(I - 1) = "0.00"
    ElseIf I = 6 Or I = 10 Or I = 14 Or I = 18 Or I = 22 Or I = 26 Or I = 30 Then
        Text1(I - 1) = "0.00"
    Else
        Text1(I - 1) = ""
    End If
Next
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"
Fecha.Text = Date

End Sub

Private Sub Text1_GotFocus(Index As Integer)
Select Case Index
Case 4, 8, 12, 16, 20, 24, 28:
    IVA = Text1(Index + 1) * Text1(Index) / 100
    STOTAL = Text1(Index + 1)
End Select
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
Case 0:
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(0) & "")
    If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
        Text1(1) = rsEmpresas!DescEmpresas
    Else
        MsgBox "La empresas no Existe", vbInformation
        Text1(0) = ""
        Text1(0).SetFocus
    End If
    Set rsEmpresas = Nothing
Case 2, 6, 10, 14, 18, 22, 26:
    If Not Text1(Index) = "" Then
    Set rsConFact = db.OpenRecordset("Select * From ConcepFact Where CodConcepto = " & Text1(Index) & "")
    If Not rsConFact.EOF And Not rsConFact.BOF Then
        Text1(Index + 1) = rsConFact!DescConcepto
        Text1(Index + 2).SetFocus
    Else
        MsgBox "El concepto mo existe", vbInformation
        Text1(Index) = ""
        Text1(Index).SetFocus
    End If
    End If
Case 4, 8, 12, 16, 20, 24, 28:
    If Text1(Index) = "" Then
        MsgBox "El Campo no puede ser nulo", vbInformation
        Text1(Index) = "0.00"
        Text1(Index).SetFocus
    End If
Case 5, 9, 13, 17, 21, 25, 29:
    If Not Text1(Index - 1) = "" Then
        Text1(Index) = FormatNumber(Text1(Index))
        TIVA = TIVA - IVA + Text1(Index) * Text1(Index - 1) / 100
        TNETO = TNETO - STOTAL + Text1(Index)
        TGRAL = TNETO + TIVA
        Text1(30) = FormatNumber(TNETO)
        Text1(31) = FormatNumber(TIVA)
        Text1(32) = FormatNumber(TGRAL)
    End If
End Select


End Sub
